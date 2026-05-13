// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FortuneCookiesAI_OG
/// @notice 0G Mainnet version of FortuneCookiesAI for Cookieverse.
/// @dev Keeps both mint modes and removes only logo upload/rendering.
///      Text mints generate a beautiful on-chain SVG inspired by 0G purple/glass design.
///      Image mints use external imageURI, e.g. Wallet Roast PNG on IPFS.
contract FortuneCookiesAI_OG is ERC721, Ownable, ERC2981, ReentrancyGuard {
    using Strings for uint256;

    event CookieMinted(address indexed minter, uint256 indexed tokenId, string fortune);
    event CookieMintedWithImage(address indexed minter, uint256 indexed tokenId, string fortune, string imageURI);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event FundsReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);

    struct MintRecord {
        uint256 id;
        address wallet;
        bool isImage;
    }

    uint256 private _nextId = 1;

    mapping(uint256 => string) private _fortuneByToken;
    mapping(uint256 => string) private _imageURIByToken;

    MintRecord[] private _mints;
    address[] private _textMinters;
    address[] private _imageMinters;

    uint256 public mintPrice;
    address public fundsReceiver;

    constructor() ERC721("Fortune Cookies AI on 0G", "COOKIEAI") Ownable(msg.sender) {
        mintPrice = 0;
        fundsReceiver = msg.sender;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        emit MintPriceUpdated(mintPrice, newPrice);
        mintPrice = newPrice;
    }

    function setFundsReceiver(address to) external onlyOwner {
        require(to != address(0), "zero addr");
        emit FundsReceiverUpdated(fundsReceiver, to);
        fundsReceiver = to;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

function withdraw() external onlyOwner nonReentrant {
    uint256 bal = address(this).balance;
    require(bal > 0, "no funds");

    (bool ok, ) = payable(fundsReceiver).call{value: bal}("");
    require(ok, "withdraw failed");
}

    function mintWithFortune(string calldata fortune) external payable nonReentrant returns (uint256 tokenId) {
        require(msg.value >= mintPrice, "not enough 0G");
        _requireShort(fortune);

        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        _fortuneByToken[tokenId] = fortune;

        _textMinters.push(msg.sender);
        _mints.push(MintRecord({id: tokenId, wallet: msg.sender, isImage: false}));

        emit CookieMinted(msg.sender, tokenId, fortune);
    }

    function mintWithImage(string calldata fortune, string calldata imageURI) external payable nonReentrant returns (uint256 tokenId) {
        require(msg.value >= mintPrice, "not enough 0G");
        _requireShort(fortune);
        require(bytes(imageURI).length >= 6, "bad imageURI");

        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        _fortuneByToken[tokenId] = fortune;
        _imageURIByToken[tokenId] = imageURI;

        _imageMinters.push(msg.sender);
        _mints.push(MintRecord({id: tokenId, wallet: msg.sender, isImage: true}));

        emit CookieMintedWithImage(msg.sender, tokenId, fortune, imageURI);
    }

    function getFortune(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no token");
        return _fortuneByToken[tokenId];
    }

    function getImageURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no token");
        return _imageURIByToken[tokenId];
    }

    function getTextMinters() external view returns (address[] memory) {
        return _textMinters;
    }

    function getImageMinters() external view returns (address[] memory) {
        return _imageMinters;
    }

    function getAllMints() external view returns (MintRecord[] memory) {
        return _mints;
    }

    function totalMinted() external view returns (uint256) {
        return _mints.length;
    }

    function totalTextMinted() external view returns (uint256) {
        return _textMinters.length;
    }

    function totalImageMinted() external view returns (uint256) {
        return _imageMinters.length;
    }

    function nextTokenId() external view returns (uint256) {
        return _nextId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no token");

        string memory fortune = _fortuneByToken[tokenId];
        string memory imageURI = _imageURIByToken[tokenId];

        if (bytes(imageURI).length > 0) {
            string memory jsonWithImage = Base64.encode(
                abi.encodePacked(
                    '{"name":"COOKIE #', tokenId.toString(),
                    '","description":"Cookieverse AI fortune or Wallet Roast image NFT minted on 0G Mainnet.",',
                    '"attributes":[',
                        '{"trait_type":"Product","value":"Cookieverse"},',
                        '{"trait_type":"Network","value":"0G Mainnet"},',
                        '{"trait_type":"Mint Type","value":"Image"},',
                        '{"trait_type":"fortune","value":"', _escapeJSON(fortune), '"}',
                    '],',
                    '"image":"', imageURI, '"}'
                )
            );
            return string.concat("data:application/json;base64,", jsonWithImage);
        }

        string memory svg = string.concat(
            _svgHead(),
            _svgGlassCapsule(),
            _svgSpark(),
            _svgLabels(),
            _svgFortune(_escapeXML(fortune)),
            _svgBrand(tokenId),
            _svgFoot()
        );

        string memory jsonOnchain = Base64.encode(
            abi.encodePacked(
                '{"name":"COOKIE #', tokenId.toString(),
                '","description":"AI-generated fortune minted on 0G Mainnet. On-chain SVG inspired by 0G purple glass design.",',
                '"attributes":[',
                    '{"trait_type":"Product","value":"Cookieverse"},',
                    '{"trait_type":"Network","value":"0G Mainnet"},',
                    '{"trait_type":"Mint Type","value":"Text"},',
                    '{"trait_type":"Image Source","value":"On-chain SVG"},',
                    '{"trait_type":"fortune","value":"', _escapeJSON(fortune), '"}',
                '],',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
            )
        );

        return string.concat("data:application/json;base64,", jsonOnchain);
    }

    function _requireShort(string memory s) internal pure {
        bytes memory b = bytes(s);
        require(b.length > 0, "empty");
        require(b.length <= 240, "too long");
    }

    function _escapeJSON(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = new bytes(b.length * 2);
        uint256 j = 0;

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == '"' || c == "\\") {
                out[j++] = "\\";
                out[j++] = c;
            } else if (c == 0x0A) {
                out[j++] = "\\";
                out[j++] = "n";
            } else if (c == 0x0D) {
                out[j++] = "\\";
                out[j++] = "r";
            } else if (c == 0x09) {
                out[j++] = "\\";
                out[j++] = "t";
            } else {
                out[j++] = c;
            }
        }

        assembly { mstore(out, j) }
        return string(out);
    }

    function _escapeXML(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = new bytes(b.length * 6);
        uint256 j = 0;

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == "&") {
                out[j++] = bytes1("&"); out[j++] = "a"; out[j++] = "m"; out[j++] = "p"; out[j++] = ";";
            } else if (c == "<") {
                out[j++] = bytes1("&"); out[j++] = "l"; out[j++] = "t"; out[j++] = ";";
            } else if (c == ">") {
                out[j++] = bytes1("&"); out[j++] = "g"; out[j++] = "t"; out[j++] = ";";
            } else {
                out[j++] = c;
            }
        }

        assembly { mstore(out, j) }
        return string(out);
    }

    function _svgHead() internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'>",
                "<defs>",
                    "<linearGradient id='bg' x1='0' y1='0' x2='800' y2='500' gradientUnits='userSpaceOnUse'>",
                        "<stop offset='0%' stop-color='#A25CFF'/>",
                        "<stop offset='45%' stop-color='#B97CFF'/>",
                        "<stop offset='82%' stop-color='#D7B6FF'/>",
                        "<stop offset='100%' stop-color='#F5E9FF'/>",
                    "</linearGradient>",
                    "<linearGradient id='pillFill' x1='190' y1='90' x2='610' y2='360' gradientUnits='userSpaceOnUse'>",
                        "<stop offset='0%' stop-color='#B77BFF' stop-opacity='0.90'/>",
                        "<stop offset='55%' stop-color='#C79DFF' stop-opacity='0.78'/>",
                        "<stop offset='100%' stop-color='#F3C7F0' stop-opacity='0.90'/>",
                    "</linearGradient>",
                    "<linearGradient id='glassStroke' x1='200' y1='100' x2='600' y2='350' gradientUnits='userSpaceOnUse'>",
                        "<stop offset='0%' stop-color='#8F58E8' stop-opacity='0.95'/>",
                        "<stop offset='30%' stop-color='#D4B5FF' stop-opacity='0.95'/>",
                        "<stop offset='70%' stop-color='#B67CFF' stop-opacity='0.92'/>",
                        "<stop offset='100%' stop-color='#F2D8FF' stop-opacity='0.92'/>",
                    "</linearGradient>",
                    "<radialGradient id='halo' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(400 195) rotate(90) scale(220 360)'>",
                        "<stop offset='0%' stop-color='#FFFFFF' stop-opacity='0.58'/>",
                        "<stop offset='25%' stop-color='#E9D6FF' stop-opacity='0.36'/>",
                        "<stop offset='65%' stop-color='#B87BFF' stop-opacity='0.18'/>",
                        "<stop offset='100%' stop-color='#FFFFFF' stop-opacity='0'/>",
                    "</radialGradient>",
                    "<filter id='shadow' x='100' y='40' width='620' height='420' filterUnits='userSpaceOnUse'>",
                        "<feDropShadow dx='0' dy='20' stdDeviation='26' flood-color='#8C63FF' flood-opacity='0.34'/>",
                    "</filter>",
                    "<filter id='blurBig' x='0' y='0' width='800' height='500' filterUnits='userSpaceOnUse'>",
                        "<feGaussianBlur stdDeviation='28'/>",
                    "</filter>",
                    "<filter id='softGlow' x='110' y='60' width='580' height='320' filterUnits='userSpaceOnUse'>",
                        "<feGaussianBlur stdDeviation='8' result='blur'/>",
                        "<feMerge><feMergeNode in='blur'/><feMergeNode in='SourceGraphic'/></feMerge>",
                    "</filter>",
                "</defs>",
                "<rect width='800' height='500' fill='url(#bg)'/>",
                "<rect width='800' height='500' fill='#FFFFFF' fill-opacity='0.06'/>",
                "<ellipse cx='255' cy='275' rx='170' ry='55' transform='rotate(-33 255 275)' fill='#9B73FF' fill-opacity='0.22' filter='url(#blurBig)'/>",
                "<ellipse cx='560' cy='330' rx='155' ry='42' transform='rotate(-28 560 330)' fill='#9B73FF' fill-opacity='0.22' filter='url(#blurBig)'/>",
                "<circle cx='635' cy='120' r='62' fill='#FFFFFF' fill-opacity='0.45' filter='url(#blurBig)'/>"
            )
        );
    }

    function _svgGlassCapsule() internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "<g filter='url(#shadow)'>",
                    "<rect x='180' y='92' width='440' height='220' rx='110' fill='url(#pillFill)' fill-opacity='0.9'/>",
                    "<rect x='180' y='92' width='440' height='220' rx='110' fill='url(#halo)'/>",
                    "<rect x='180.75' y='92.75' width='438.5' height='218.5' rx='109.25' stroke='url(#glassStroke)' stroke-width='1.5' stroke-opacity='0.95'/>",
                    "<rect x='188' y='100' width='424' height='204' rx='102' stroke='#FFFFFF' stroke-opacity='0.45' stroke-width='4'/>",
                    "<path d='M214 109C246 98 300 95 372 98' stroke='#FFFFFF' stroke-opacity='0.7' stroke-width='6' stroke-linecap='round'/>",
                    "<circle cx='236' cy='120' r='14' fill='#FFFFFF' fill-opacity='0.58' filter='url(#softGlow)'/>",
                    "<circle cx='600' cy='112' r='16' fill='#FFFFFF' fill-opacity='0.72' filter='url(#softGlow)'/>",
                    "<circle cx='214' cy='294' r='10' fill='#FFFFFF' fill-opacity='0.65' filter='url(#softGlow)'/>",
                    "<circle cx='585' cy='299' r='10' fill='#FFFFFF' fill-opacity='0.72' filter='url(#softGlow)'/>",
                "</g>"
            )
        );
    }

    function _svgSpark() internal pure returns (string memory) {
        return "<path d='M400 128C407.5 153 430 158 455 158C430 158 407.5 163 400 188C392.5 163 370 158 345 158C370 158 392.5 153 400 128Z' fill='#FFFFFF' filter='url(#softGlow)'/>";
    }

    function _svgLabels() internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "<text x='126' y='186' fill='#C79AF3' font-family='Arial, Helvetica, sans-serif' font-size='28' font-weight='500'>Built</text>",
                "<text x='640' y='186' fill='#C79AF3' font-family='Arial, Helvetica, sans-serif' font-size='28' font-weight='500'>For AI Agents</text>"
            )
        );
    }

    function _svgFortune(string memory fortuneEsc) internal pure returns (string memory) {
        return string.concat(
            "<foreignObject x='220' y='188' width='360' height='92'>",
                "<div xmlns='http://www.w3.org/1999/xhtml' style='",
                    "width:360px;height:92px;display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;padding:0 22px;",
                    "font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;line-height:1.22;letter-spacing:-0.02em;color:#FFFFFF;",
                    "text-shadow:0 2px 18px rgba(92,48,180,0.45);",
                "'>",
                    fortuneEsc,
                "</div>",
            "</foreignObject>"
        );
    }

    function _svgBrand(uint256 tokenId) internal pure returns (string memory) {
        return string.concat(
            "<text x='400' y='383' text-anchor='middle' fill='#FFFFFF' font-family='Arial, Helvetica, sans-serif' font-size='34' font-weight='800' letter-spacing='0.08em'>COOKIEVERSE</text>",
            "<text x='400' y='418' text-anchor='middle' fill='#F7F0FF' fill-opacity='0.9' font-family='Arial, Helvetica, sans-serif' font-size='17' font-weight='500' letter-spacing='0.12em'>AI FORTUNE ON 0G</text>",
            "<text x='400' y='446' text-anchor='middle' fill='#FFFFFF' fill-opacity='0.82' font-family='monospace' font-size='13'>COOKIE #",
                tokenId.toString(),
            "</text>"
        );
    }

    function _svgFoot() internal pure returns (string memory) {
        return "</svg>";
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
